module PaginationHelper
  extend ActiveSupport::Concern

  # Paginate a collection and return data + metadata
  # Usage: paginate(ServiceRequest.all)
  def paginate(collection, page: params[:page], items: params[:per_page])
    # Set defaults
    page = (page || 1).to_i
    items = (items || 25).to_i
    items = [items, 100].min # Cap at 100 items per page

    # Get total count
    total_count = collection.count(:all)

    # Calculate pagination metadata manually
    total_pages = (total_count.to_f / items).ceil
    total_pages = 1 if total_pages == 0

    # Ensure page is within bounds
    page = [[page, 1].max, total_pages].min

    # Calculate offset
    offset = (page - 1) * items

    # Get paginated records
    records = collection.offset(offset).limit(items)

    # Return hash with records and pagination metadata
    {
      data: records,
      pagination: {
        current_page: page,
        per_page: items,
        total_items: total_count,
        total_pages: total_pages,
        prev_page: page > 1 ? page - 1 : nil,
        next_page: page < total_pages ? page + 1 : nil
      }
    }
  end

  # Check if page parameter is valid
  def validate_page_params
    if params[:page].present? && params[:page].to_i < 1
      error!({ error: 'Page must be greater than 0' }, 400)
    end

    if params[:per_page].present?
      per_page = params[:per_page].to_i
      if per_page < 1
        error!({ error: 'Per page must be greater than 0' }, 400)
      elsif per_page > 100
        error!({ error: 'Per page cannot exceed 100' }, 400)
      end
    end
  end
end
