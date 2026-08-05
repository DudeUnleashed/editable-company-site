# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.2].define(version: 2026_05_31_000003) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "active_storage_attachments", force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.bigint "record_id", null: false
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.string "key", null: false
    t.string "filename", null: false
    t.string "content_type"
    t.text "metadata"
    t.string "service_name", null: false
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.datetime "created_at", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "audit_logs", force: :cascade do |t|
    t.bigint "user_id"
    t.string "action", null: false
    t.string "resource_type"
    t.bigint "resource_id"
    t.jsonb "details", default: {}
    t.string "ip_address"
    t.string "user_agent"
    t.datetime "created_at", null: false
    t.index ["action"], name: "index_audit_logs_on_action"
    t.index ["created_at"], name: "index_audit_logs_on_created_at"
    t.index ["resource_type", "resource_id"], name: "index_audit_logs_on_resource_type_and_resource_id"
    t.index ["user_id"], name: "index_audit_logs_on_user_id"
  end

  create_table "content_blocks", force: :cascade do |t|
    t.string "page", null: false
    t.string "section", null: false
    t.string "content_type", default: "text"
    t.text "content"
    t.integer "position", default: 0
    t.boolean "active", default: true, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["page", "section"], name: "index_content_blocks_on_page_and_section", unique: true
    t.index ["page"], name: "index_content_blocks_on_page"
  end

  create_table "customers", force: :cascade do |t|
    t.string "name", null: false
    t.string "email"
    t.string "phone"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.text "notes"
    t.text "suggested_next_services"
    t.index ["email"], name: "index_customers_on_email"
  end

  create_table "gallery_images", force: :cascade do |t|
    t.string "caption"
    t.string "alt_text"
    t.integer "position", default: 0
    t.boolean "active", default: true, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["active"], name: "index_gallery_images_on_active"
    t.index ["position"], name: "index_gallery_images_on_position"
  end

  create_table "google_calendar_settings", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.text "access_token"
    t.text "refresh_token"
    t.datetime "expires_at"
    t.string "calendar_id", default: "primary"
    t.boolean "sync_enabled", default: true, null: false
    t.datetime "last_synced_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_google_calendar_settings_on_user_id", unique: true
  end

  create_table "refresh_tokens", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "token_digest", null: false
    t.datetime "expires_at", null: false
    t.datetime "revoked_at"
    t.string "ip_address"
    t.string "user_agent"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["expires_at"], name: "index_refresh_tokens_on_expires_at"
    t.index ["token_digest"], name: "index_refresh_tokens_on_token_digest", unique: true
    t.index ["user_id", "revoked_at"], name: "index_refresh_tokens_on_user_id_and_revoked_at"
    t.index ["user_id"], name: "index_refresh_tokens_on_user_id"
  end

  create_table "reviews", force: :cascade do |t|
    t.string "customer_name", null: false
    t.text "content", null: false
    t.integer "rating", null: false
    t.string "service_category"
    t.date "review_date"
    t.boolean "featured", default: false, null: false
    t.boolean "active", default: true, null: false
    t.integer "position", default: 0
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["active"], name: "index_reviews_on_active"
    t.index ["featured"], name: "index_reviews_on_featured"
  end

  create_table "service_requests", force: :cascade do |t|
    t.bigint "service_id"
    t.string "car_type"
    t.string "rego_or_vin"
    t.date "last_serviced_on"
    t.text "notes"
    t.string "preferred_contact_method"
    t.boolean "returning_customer", default: false
    t.string "status", default: "pending"
    t.decimal "quoted_price", precision: 10, scale: 2
    t.datetime "scheduled_start"
    t.datetime "scheduled_end"
    t.integer "estimated_duration_minutes"
    t.text "admin_notes"
    t.string "assigned_technician"
    t.datetime "accepted_at"
    t.datetime "completed_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "google_event_id"
    t.bigint "customer_id", null: false
    t.datetime "completion_email_sent_at"
    t.index ["customer_id"], name: "index_service_requests_on_customer_id"
    t.index ["google_event_id"], name: "index_service_requests_on_google_event_id"
    t.index ["scheduled_start"], name: "index_service_requests_on_scheduled_start"
    t.index ["service_id"], name: "index_service_requests_on_service_id"
  end

  create_table "services", force: :cascade do |t|
    t.string "name", null: false
    t.text "description"
    t.decimal "base_price", precision: 10, scale: 2
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "active", default: true, null: false
    t.integer "estimated_duration", comment: "Duration in minutes"
    t.string "category", default: "general"
    t.text "detailed_description"
    t.index ["active"], name: "index_services_on_active"
    t.index ["category"], name: "index_services_on_category"
  end

  create_table "users", force: :cascade do |t|
    t.string "name", null: false
    t.string "email", null: false
    t.string "phone"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "password_digest", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "audit_logs", "users"
  add_foreign_key "google_calendar_settings", "users"
  add_foreign_key "refresh_tokens", "users"
  add_foreign_key "service_requests", "customers"
  add_foreign_key "service_requests", "services"
end
