require_relative "entities/gallery_image_entity"

class Gallery < Grape::API
  format :json

  resource :gallery do
    desc "Get all active gallery images (public)"
    get do
      images = GalleryImage.active.ordered.includes(image_attachment: :blob)
      present images, with: GalleryImageEntity
    end
  end

  namespace :admin do
    before { admin_only! }

    resource :gallery do
      desc "Get all gallery images (admin)"
      get do
        images = GalleryImage.ordered.includes(image_attachment: :blob)
        present images, with: GalleryImageEntity
      end

      desc "Upload a gallery image"
      params do
        requires :image, type: File, desc: "Image file"
        optional :caption, type: String
        optional :alt_text, type: String
        optional :position, type: Integer, default: 0
        optional :active, type: Boolean, default: true
      end
      post do
        file = params[:image]
        tempfile = file.respond_to?(:tempfile) ? file.tempfile : file[:tempfile]
        filename = file.respond_to?(:original_filename) ? file.original_filename : file[:filename]
        content_type = file.respond_to?(:content_type) ? file.content_type : file[:type]
        tempfile.rewind if tempfile.respond_to?(:rewind)

        gallery_image = GalleryImage.new(
          caption: params[:caption],
          alt_text: params[:alt_text],
          position: params[:position] || 0,
          active: params[:active].nil? ? true : params[:active]
        )
        gallery_image.image.attach(
          io: tempfile,
          filename: filename,
          content_type: content_type
        )

        unless gallery_image.save
          error!({ error: gallery_image.errors.full_messages.join(", ") }, 422)
        end

        log_audit(action: 'gallery_upload', resource: gallery_image)
        present gallery_image, with: GalleryImageEntity
      end

      desc "Update gallery image metadata"
      params do
        requires :id, type: Integer
        optional :caption, type: String
        optional :alt_text, type: String
        optional :position, type: Integer
        optional :active, type: Boolean
      end
      put ":id" do
        image = GalleryImage.find(params[:id])
        attrs = declared(params, include_missing: false).except(:id)
        before = image.attributes.slice(*attrs.keys.map(&:to_s))
        image.update!(attrs)
        log_audit(action: 'gallery_update', resource: image, details: { before: before, after: attrs })
        present image, with: GalleryImageEntity
      end

      desc "Delete a gallery image"
      params do
        requires :id, type: Integer
      end
      delete ":id" do
        image = GalleryImage.find(params[:id])
        snapshot = image.attributes
        log_audit(action: 'gallery_delete', resource: image, details: { snapshot: snapshot })
        image.image.purge if image.image.attached?
        image.destroy!
        { success: true }
      end

      desc "Bulk reorder gallery images"
      params do
        requires :order, type: Array do
          requires :id, type: Integer
          requires :position, type: Integer
        end
      end
      put "reorder" do
        params[:order].each do |item|
          GalleryImage.where(id: item[:id]).update_all(position: item[:position])
        end
        images = GalleryImage.ordered.includes(image_attachment: :blob)
        present images, with: GalleryImageEntity
      end
    end
  end
end
