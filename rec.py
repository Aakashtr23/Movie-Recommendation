from flask import Flask, request, jsonify
import pandas as pd
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from flask_cors import CORS
from fuzzywuzzy import process

app = Flask(__name__)
CORS(app)

# Data loading
movies = pd.read_csv('dataset_used/dataset.csv')

# Data preprocessing
movies = movies.drop_duplicates(subset=['movieId'])
movies = movies[['movieId', 'title', 'overview', 'genres', 'rating', 'budget', 'production_countries', 'original_language', 'keywords']]

movies['tags'] = movies['overview'].fillna('') + ' ' + movies['genres'].fillna('') + ' ' + movies['keywords'].fillna('')
newdata = movies.drop(columns=['overview', 'genres', 'keywords'])

# Vectorizing for content-based filtering
cv = CountVectorizer(max_features=10000, stop_words='english')
vector = cv.fit_transform(newdata['tags'].values.astype('U')).toarray()
similarity = cosine_similarity(vector)


# Content-based filtering
@app.route('/recommend/title', methods=['GET'])
def recommend_content_based():
    movie_title = request.args.get('title').lower()
    index = newdata[newdata['title'].str.lower() == movie_title].index
    
    if not index.empty:
        # Exact match found, return recommendations based on content
        index = index[0]
        distances = sorted(list(enumerate(similarity[index])), reverse=True, key=lambda x: x[1])
        recommended_movies = []
        for i in distances[1:]:
            movie_title = newdata.iloc[i[0]].title
            if movie_title not in recommended_movies:
                recommended_movies.append(movie_title)
            if len(recommended_movies) == 5:
                break
        return jsonify(recommended_movies)
    else:
        # If no exact match, use fuzzy matching to suggest similar titles
        all_titles = newdata['title'].values
        suggestions = process.extract(movie_title, all_titles, limit=20)
        suggested_titles = [title for title, score in suggestions]
        return jsonify(suggested_titles)

# Rating-based recommendations
@app.route('/recommend/rating', methods=['GET'])
def recommend_by_rating():
    user_rating = request.args.get('rating')
    
    if not user_rating:
        return jsonify([])  # Return an empty list if no rating is provided

    try:
        user_rating = float(user_rating)
    except ValueError:
        return jsonify([])  # Handle invalid input by returning an empty list
    
    tolerance = float(request.args.get('tolerance', 0.5))  # Default tolerance to 0.5
    rating_filter = (movies['rating'] >= user_rating - tolerance) & (movies['rating'] <= user_rating + tolerance)
    filtered_movies = movies[rating_filter]
    
    return jsonify(filtered_movies['title'].drop_duplicates().tolist())



# Budget-based recommendations
@app.route('/recommend/budget', methods=['GET'])
def recommend_by_budget():
    user_budget = float(request.args.get('budget'))
    tolerance = float(request.args.get('tolerance', 1000000))
    budget_filter = (movies['budget'] >= user_budget - tolerance) & (movies['budget'] <= user_budget + tolerance)
    filtered_movies = movies[budget_filter]
    return jsonify(filtered_movies['title'].drop_duplicates().tolist())


# Country-based recommendations
@app.route('/recommend/country', methods=['GET'])
def recommend_by_country():
    country = request.args.get('country').lower()
    country_filter = movies['production_countries'].str.contains(country, case=False, na=False)
    filtered_movies = movies[country_filter]
    return jsonify(filtered_movies['title'].drop_duplicates().tolist())


# Language-based recommendations
@app.route('/recommend/language', methods=['GET'])
def recommend_by_language():
    language = request.args.get('language').lower()
    language_filter = movies['original_language'].str.lower() == language
    filtered_movies = movies[language_filter]
    return jsonify(filtered_movies['title'].drop_duplicates().tolist())


# Running the Flask app
if __name__ == "__main__":
    app.run(debug=True)
