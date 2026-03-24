function SearchBar({
  searchTerm,
  onSearchChange,
  selectedCategory,
  categories,
  onCategoryChange,
  debouncedSearchTerm,
  isSearchPending,
  debounceDelayMs,
}) {
  // Render the search + filter controls. The actual state still lives in ProductPage.
  return (
    <div className="filter-panel">
      <div className="filter-row">
        <div className="filter-field">
          <label className="search-label" htmlFor="product-search">
            Search by product name
          </label>
          <input
            id="product-search"
            className="search-input"
            type="text"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Try wireless"
          />
        </div>

        <div className="filter-field">
          <label className="search-label" htmlFor="product-category">
            Filter by category
          </label>
          <select
            id="product-category"
            className="category-select"
            value={selectedCategory}
            onChange={(event) => onCategoryChange(event.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Helper text makes the debounce behavior easier for a beginner to understand. */}
      <p className="search-helper">
        Input state updates immediately. The API call waits {debounceDelayMs}ms after typing stops.
      </p>
      <p className="search-helper">
        Active backend search: <strong>{debouncedSearchTerm || 'All products'}</strong>
      </p>
      <p className="search-helper">
        Active category filter: <strong>{selectedCategory || 'All categories'}</strong>
      </p>
      {isSearchPending ? (
        <p className="search-helper">Waiting for typing to pause before fetching...</p>
      ) : null}
    </div>
  )
}

export default SearchBar
