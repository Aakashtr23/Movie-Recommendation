import { useState } from "react";
import axios from "axios";


function App() {
  const [searchType, setSearchType] = useState("title");
  const [searchValue, setSearchValue] = useState("");
  const [results, setResults] = useState([]);
  const [exactMatch, setExactMatch] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      let url;
      if (searchType === "rating") {
        // Construct URL for rating-based search
        url = `http://127.0.0.1:5000/recommend/${searchType}?rating=${parseFloat(searchValue)}`;
      } else {
        // Construct URL for other searches
        url = `http://127.0.0.1:5000/recommend/${searchType}?${searchType}=${searchValue}`;
      }
      
      const response = await axios.get(url);
      setResults(response.data);

      // If searchType is "title" and no exact match was found, assume suggestions are returned
      if (searchType === "title" && response.data.length > 0 && response.data[0].toLowerCase() !== searchValue.toLowerCase()) {
        setExactMatch(false);
      } else {
        setExactMatch(true);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full bg-white p-10 rounded-xl shadow-2xl transition duration-500 hover:scale-105">
        <h1 className="text-5xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-8">
          Movie Recommendation Search
        </h1>
        <div className="mb-8 flex flex-col sm:flex-row items-center">
          <select
            className="p-4 border-2 border-purple-500 rounded-lg text-purple-700 font-bold focus:outline-none focus:ring-4 focus:ring-purple-300 transition duration-300 ease-in-out"
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
          >
            <option value="title">Search by Title</option>
            <option value="rating">Search by Rating</option>
            <option value="budget">Search by Budget</option>
            <option value="country">Search by Country</option>
            <option value="language">Search by Language</option>
          </select>

          {/* Input field dynamically adjusts based on the search type */}
          <input
            type={searchType === "rating" ? "number" : "text"}
            step={searchType === "rating" ? "0.1" : undefined}
            min={searchType === "rating" ? "0" : undefined}
            max={searchType === "rating" ? "10" : undefined}
            placeholder={`Enter ${searchType}`}
            className="ml-0 mt-4 sm:mt-0 sm:ml-6 p-4 border-2 border-purple-500 rounded-lg text-purple-700 font-semibold focus:outline-none focus:ring-4 focus:ring-purple-300 transition duration-300 ease-in-out"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
          <button
            onClick={handleSearch}
            className="ml-0 mt-4 sm:mt-0 sm:ml-6 bg-purple-600 text-white font-bold py-4 px-6 rounded-lg transition transform hover:bg-purple-700 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-purple-300 duration-300 ease-in-out"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
        <div>
          <h2 className="text-3xl font-bold text-purple-800 mb-4">Results:</h2>
          {loading ? (
            <p className="text-center text-gray-500">Loading results...</p>
          ) : results.length > 0 ? (
            <div>
              {!exactMatch && (
                <p className="text-center text-red-500 mb-4">
                  No exact match found, here are some suggestions:
                </p>
              )}
              <ul className="list-disc list-inside space-y-4">
                {results.map((result, index) => (
                  <li key={index} className="text-xl font-medium text-purple-800 hover:text-purple-600">
                    {result}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-center text-gray-500">No results found.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
