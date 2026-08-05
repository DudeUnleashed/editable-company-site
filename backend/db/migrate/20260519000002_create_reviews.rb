class CreateReviews < ActiveRecord::Migration[7.2]
  def change
    create_table :reviews do |t|
      t.string :customer_name, null: false
      t.text :content, null: false
      t.integer :rating, null: false
      t.string :service_category
      t.date :review_date
      t.boolean :featured, default: false, null: false
      t.boolean :active, default: true, null: false
      t.integer :position, default: 0

      t.timestamps
    end

    add_index :reviews, :active
    add_index :reviews, :featured
  end
end
