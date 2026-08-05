class CreateGalleryImages < ActiveRecord::Migration[7.2]
  def change
    create_table :gallery_images do |t|
      t.string :caption
      t.string :alt_text
      t.integer :position, default: 0
      t.boolean :active, default: true, null: false

      t.timestamps
    end

    add_index :gallery_images, :active
    add_index :gallery_images, :position
  end
end
