class InputSanitizer
  # Sanitize text fields - removes all HTML tags and scripts
  # @param text [String] The input text to sanitize
  # @return [String] Sanitized text with HTML stripped
  def self.sanitize_text(text)
    return nil if text.nil?
    return text unless text.is_a?(String)

    Sanitize.fragment(text, Sanitize::Config::RESTRICTED).strip.gsub(/[\r\n]/, '')
  end

  # Sanitize fields that may contain basic formatting
  # Allows basic safe tags like <b>, <i>, <p>, <br>
  # @param text [String] The input text to sanitize
  # @return [String] Sanitized text with safe HTML only
  def self.sanitize_basic_html(text)
    return nil if text.nil?
    return text unless text.is_a?(String)

    # Allow only safe basic formatting tags
    Sanitize.fragment(text, Sanitize::Config::BASIC).strip
  end

  # Sanitize CMS rich text content - allows broader formatting tags
  def self.sanitize_cms_html(text)
    return nil if text.nil?
    return text unless text.is_a?(String)

    config = Sanitize::Config.merge(Sanitize::Config::RELAXED,
      elements: Sanitize::Config::RELAXED[:elements] + ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
      remove_contents: ['script', 'style']
    )
    Sanitize.fragment(text, config).strip
  end

  # Sanitize multiple fields in a hash
  # @param hash [Hash] Hash of field_name => value
  # @param fields [Array<Symbol>] Array of field names to sanitize
  # @return [Hash] Hash with sanitized values
  def self.sanitize_fields(hash, fields)
    fields.each do |field|
      if hash[field].present?
        hash[field] = sanitize_text(hash[field])
      end
    end
    hash
  end
end
