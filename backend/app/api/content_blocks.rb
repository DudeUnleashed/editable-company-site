require_relative "entities/content_block_entity"

class ContentBlocks < Grape::API
  format :json

  resource :content do
    desc "Get all active content blocks for a page"
    params do
      requires :page, type: String, desc: "Page slug (e.g. home, about)"
    end
    get do
      blocks = ContentBlock.active.for_page(params[:page])
      present blocks, with: ContentBlockEntity
    end
  end

  namespace :admin do
    before { admin_only! }

    resource :content do
      desc "Get all content blocks (admin)"
      params do
        optional :page, type: String, desc: "Filter by page"
      end
      get do
        blocks = ContentBlock.order(:page, :position)
        blocks = blocks.where(page: params[:page]) if params[:page].present?
        present blocks, with: ContentBlockEntity
      end

      desc "Update a content block"
      params do
        requires :id, type: Integer
        optional :content, type: String
        optional :content_type, type: String, values: %w[text html json]
        optional :position, type: Integer
        optional :active, type: Boolean
      end
      put ":id" do
        block = ContentBlock.find(params[:id])
        update_params = declared(params, include_missing: false).except(:id)
        before = block.attributes.slice(*update_params.keys.map(&:to_s))
        block.update!(update_params)
        log_audit(action: 'content_update', resource: block, details: { before: before, after: update_params })
        present block, with: ContentBlockEntity
      end

      desc "Upload site favicon"
      params do
        requires :favicon, type: File, desc: "Favicon image file (ICO, PNG, or SVG)"
      end
      post "favicon" do
        file = params[:favicon]
        tempfile = file.respond_to?(:tempfile) ? file.tempfile : file[:tempfile]
        filename = file.respond_to?(:original_filename) ? file.original_filename : file[:filename]
        content_type = file.respond_to?(:content_type) ? file.content_type : file[:type]
        tempfile.rewind if tempfile.respond_to?(:rewind)

        allowed = ["image/x-icon", "image/vnd.microsoft.icon", "image/png", "image/svg+xml", "image/ico"]
        unless allowed.include?(content_type)
          error!({ error: "Favicon must be ICO, PNG, or SVG" }, 422)
        end

        block = ContentBlock.find_or_create_by!(page: "settings", section: "favicon") do |b|
          b.content_type = "text"
          b.content = ""
          b.position = 2
        end

        block.favicon_file.attach(io: tempfile, filename: filename, content_type: content_type)

        host = ENV['BACKEND_HOST'] || 'http://localhost:3000'
        url = Rails.application.routes.url_helpers.rails_blob_url(block.favicon_file, host: host)
        block.update!(content: url)

        log_audit(action: 'favicon_upload', resource: block)
        { success: true, favicon_url: url }
      end

      desc "Delete site favicon"
      delete "favicon" do
        block = ContentBlock.find_by(page: "settings", section: "favicon")
        if block&.favicon_file&.attached?
          block.favicon_file.purge
          block.update!(content: "")
          log_audit(action: 'favicon_delete', resource: block)
        end
        { success: true }
      end

      desc "Upload site logo"
      params do
        requires :logo, type: File, desc: "Logo image file (PNG, JPG, SVG, or WebP)"
      end
      post "logo" do
        file = params[:logo]
        tempfile = file.respond_to?(:tempfile) ? file.tempfile : file[:tempfile]
        filename = file.respond_to?(:original_filename) ? file.original_filename : file[:filename]
        content_type = file.respond_to?(:content_type) ? file.content_type : file[:type]
        tempfile.rewind if tempfile.respond_to?(:rewind)

        allowed = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"]
        unless allowed.include?(content_type)
          error!({ error: "Logo must be PNG, JPG, SVG, or WebP" }, 422)
        end

        block = ContentBlock.find_or_create_by!(page: "settings", section: "logo") do |b|
          b.content_type = "text"
          b.content = ""
          b.position = 20
        end

        block.logo_file.attach(io: tempfile, filename: filename, content_type: content_type)

        host = ENV['BACKEND_HOST'] || 'http://localhost:3000'
        url = Rails.application.routes.url_helpers.rails_blob_url(block.logo_file, host: host)
        block.update!(content: url)

        log_audit(action: 'logo_upload', resource: block)
        { success: true, logo_url: url }
      end

      desc "Delete site logo"
      delete "logo" do
        block = ContentBlock.find_by(page: "settings", section: "logo")
        if block&.logo_file&.attached?
          block.logo_file.purge
          block.update!(content: "")
          log_audit(action: 'logo_delete', resource: block)
        end
        { success: true }
      end

      desc "Bulk update content blocks for a page"
      params do
        requires :blocks, type: Array do
          requires :id, type: Integer
          optional :content, type: String
          optional :content_type, type: String, values: %w[text html json]
          optional :position, type: Integer
          optional :active, type: Boolean
        end
      end
      put "bulk_update" do
        updated = []
        changes = []
        params[:blocks].each do |block_params|
          block = ContentBlock.find(block_params[:id])
          attrs = block_params.to_h.except("id")
          before = block.attributes.slice(*attrs.keys.map(&:to_s))
          block.update!(attrs)
          changes << { id: block.id, section: block.section, before: before, after: attrs }
          updated << block
        end
        log_audit(action: 'content_bulk_update', details: { changes: changes })
        present updated, with: ContentBlockEntity
      end
    end
  end
end
