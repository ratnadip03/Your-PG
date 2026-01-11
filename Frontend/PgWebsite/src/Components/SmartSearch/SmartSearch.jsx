import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FaSearch, FaRobot, FaTimes } from "react-icons/fa";
import { Link } from "react-router-dom";
import "./SmartSearch.css";

function SmartSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) {
      toast.error("Please enter a search query");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("http://localhost:5000/api/ai/smart-search", {
        query: query.trim()
      });

      setResults(response.data);
      // Add to search history
      setSearchHistory(prev => {
        const newHistory = [query, ...prev.filter(q => q !== query)].slice(0, 5);
        return newHistory;
      });
    } catch (error) {
      console.error("Smart search error:", error);
      toast.error(error.response?.data?.error || "Failed to process search. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery("");
    setResults(null);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="smart-search-toggle"
        aria-label="Open Smart Search"
      >
        <FaRobot />
      </button>

      {/* Search Panel */}
      {isOpen && (
        <div className="smart-search-panel">
          <div className="smart-search-header">
            <h3>
              <FaRobot style={{ marginRight: "8px" }} />
              Smart Search (AI-Powered)
            </h3>
            <button
              onClick={() => {
                setIsOpen(false);
                handleClear();
              }}
              className="close-btn"
            >
              <FaTimes />
            </button>
          </div>

          <form onSubmit={handleSearch} className="smart-search-form">
            <div className="search-input-wrapper">
              <FaSearch className="search-icon" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='Try: "Find me a PG near IIT Bombay with AC under 10k"'
                className="smart-search-input"
              />
              {query && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="clear-input-btn"
                >
                  <FaTimes />
                </button>
              )}
            </div>

            {/* Search History */}
            {searchHistory.length > 0 && !query && (
              <div className="search-history">
                <small>Recent searches:</small>
                {searchHistory.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setQuery(item)}
                    className="history-item"
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="smart-search-submit"
            >
              {loading ? "Searching..." : "Search with AI"}
            </button>
          </form>

          {/* Results */}
          {results && (
            <div className="smart-search-results">
              {results.interpretedQuery && (
                <div className="interpreted-query">
                  <strong>AI Understanding:</strong>
                  <p>{results.interpretedQuery}</p>
                </div>
              )}

              {results.searchParams && (
                <div className="search-params">
                  <strong>Search Parameters:</strong>
                  <ul>
                    {results.searchParams.location && (
                      <li>Location: {results.searchParams.location}</li>
                    )}
                    {results.searchParams.college && (
                      <li>College: {results.searchParams.college}</li>
                    )}
                    {results.searchParams.minPrice && (
                      <li>Min Price: ₹{results.searchParams.minPrice}</li>
                    )}
                    {results.searchParams.maxPrice && (
                      <li>Max Price: ₹{results.searchParams.maxPrice}</li>
                    )}
                    {results.searchParams.tenantType && (
                      <li>Tenant Type: {results.searchParams.tenantType}</li>
                    )}
                    {results.searchParams.services && results.searchParams.services.length > 0 && (
                      <li>Services: {results.searchParams.services.join(", ")}</li>
                    )}
                  </ul>
                </div>
              )}

              <div className="results-count">
                Found {results.count || 0} properties
              </div>

              {results.results && results.results.length > 0 ? (
                <div className="results-list">
                  {results.results.map((property) => (
                    <Link
                      key={property._id}
                      to={`/property/${property._id}`}
                      className="result-item"
                      onClick={() => setIsOpen(false)}
                    >
                      <div className="result-item-header">
                        <h4>{property.title}</h4>
                        {property.averageRating > 0 && (
                          <span className="rating-badge">
                            ⭐ {property.averageRating}
                          </span>
                        )}
                      </div>
                      <p className="result-location">
                        📍 {property.location?.address || property.location}
                      </p>
                      <p className="result-price">
                        ₹{property.price.toLocaleString('en-IN')}/month
                      </p>
                      {property.services && property.services.length > 0 && (
                        <div className="result-services">
                          {property.services.slice(0, 3).map((service, idx) => (
                            <span key={idx} className="service-tag">
                              {service}
                            </span>
                          ))}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="no-results">
                  <p>No properties found matching your criteria.</p>
                  <p style={{ fontSize: "12px", color: "#666", marginTop: "10px" }}>
                    Try adjusting your search query or filters.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tips */}
          {!results && (
            <div className="search-tips">
              <strong>💡 Tips:</strong>
              <ul>
                <li>Use natural language queries</li>
                <li>Mention location, price, amenities, or college name</li>
                <li>Example: "PG near MIT with AC and WiFi under 15k"</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default SmartSearch;
