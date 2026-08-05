class CreateContentBlocks < ActiveRecord::Migration[7.2]
  def change
    create_table :content_blocks do |t|
      t.string :page, null: false
      t.string :section, null: false
      t.string :content_type, default: "text"
      t.text :content
      t.integer :position, default: 0
      t.boolean :active, default: true, null: false

      t.timestamps
    end

    add_index :content_blocks, [:page, :section], unique: true
    add_index :content_blocks, :page
  end
end
