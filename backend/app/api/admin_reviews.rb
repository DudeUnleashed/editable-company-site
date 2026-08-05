require_relative "entities/review_entity"

class AdminReviews < Grape::API
  format :json

  resource :reviews do
    desc "Get all active reviews (public)"
    get do
      reviews = Review.active.ordered
      present reviews, with: ReviewEntity
    end
  end

  namespace :admin do
    before { admin_only! }

    resource :reviews do
      desc "Get all reviews (admin)"
      get do
        reviews = Review.order(position: :asc, created_at: :desc)
        present reviews, with: ReviewEntity
      end

      desc "Create a review"
      params do
        requires :customer_name, type: String
        requires :content, type: String
        requires :rating, type: Integer, values: 1..5
        optional :service_category, type: String
        optional :review_date, type: Date
        optional :featured, type: Boolean, default: false
        optional :active, type: Boolean, default: true
        optional :position, type: Integer, default: 0
      end
      post do
        review = Review.create!(declared(params, include_missing: false))
        log_audit(action: 'review_create', resource: review)
        present review, with: ReviewEntity
      end

      desc "Update a review"
      params do
        requires :id, type: Integer
        optional :customer_name, type: String
        optional :content, type: String
        optional :rating, type: Integer, values: 1..5
        optional :service_category, type: String
        optional :review_date, type: Date
        optional :featured, type: Boolean
        optional :active, type: Boolean
        optional :position, type: Integer
      end
      put ":id" do
        review = Review.find(params[:id])
        update_params = declared(params, include_missing: false).except(:id)
        before = review.attributes.slice(*update_params.keys.map(&:to_s))
        review.update!(update_params)
        log_audit(action: 'review_update', resource: review, details: { before: before, after: update_params })
        present review, with: ReviewEntity
      end

      desc "Delete a review"
      params do
        requires :id, type: Integer
      end
      delete ":id" do
        review = Review.find(params[:id])
        snapshot = review.attributes
        log_audit(action: 'review_delete', resource: review, details: { snapshot: snapshot })
        review.destroy!
        { success: true }
      end
    end
  end
end
