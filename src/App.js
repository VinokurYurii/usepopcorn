import {useEffect, useRef, useState} from "react";
import StarRating from "./components/StarRating";
import {useMovies} from "./components/useMovies";
import {useLocalStorageState} from "./components/useLocalStorageState";

const average = (arr) =>
  arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);

const KEY = 'c5fcbcc7';

export default function App() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [selectedWatchedMovie, setSelectedWatchedMovie] = useState(null);
  const [watched, setWatched] = useLocalStorageState([], "watched");
  const {movies, isLoading, error} = useMovies(query, handleCloseMovie);

  function handleQuery(queryText) {
    setQuery(queryText);
  }

  function handleSetSelectedId(id) {
    const newValue = id === selectedId ? null : id;

    setSelectedWatchedMovie(watched.find(m => m.imdbID === id));
    setSelectedId(newValue);
  }

  function handleCloseMovie() {
    setSelectedId(null);
  }

  function handleAddWatched(movie) {
    if (watched.find(m => m.imdbID === movie.imdbID)) return;

    setWatched(watched => [...watched, movie]);
  }

  function handleDeleteWatched(id) {
    setWatched(watched => watched.filter(m => m.imdbID !== id))
  }

  // useEffect(() => {
  //   localStorage.setItem('watched', JSON.stringify(watched));
  // }, [watched]);

  return (
    <>
      <NavBar>
        <Logo />
        <Search query={query} onQuery={handleQuery}/>
        <NumResults movies={movies}/>
      </NavBar>
      <Main>
        <Box>
          {isLoading && <Loader />}
          {!isLoading && !error && <MoviesList movies={movies} onSetSelectedId={handleSetSelectedId}/>}
          {error && <ErrorMessage>{error}</ErrorMessage>}
        </Box>
        <Box>
          {
            selectedId ?
              <SelectedMovie
                selectedId={selectedId}
                onCloseMovie={handleCloseMovie}
                onAddWatched={handleAddWatched}
                selectedWatchedMovie={selectedWatchedMovie}
              /> :
              <>
                <Summary watched={watched}/>
                <WatchedList watched={watched} onDelete={handleDeleteWatched} />
              </>
          }
        </Box>
      </Main>
    </>
  );
}

function ErrorMessage({children}) {
  return <p className="error">{children}</p>
}

function Loader () {
  return <p className="loader">Loading...</p>
}

function NavBar({children}) {
  return <nav className="nav-bar">
    {children}
  </nav>
}

function Logo() {
  return <div className="logo">
    <span role="img">🍿</span>
    <h1>usePopcorn</h1>
  </div>
}

function NumResults({movies}) {
  return <p className="num-results">
    Found <strong>{movies.length}</strong> results
  </p>
}

function Search({query, onQuery}) {
  const inputElement = useRef(null);

  useEffect(function () {
    const callback = (e) => {

      if(document.activeElement === inputElement.current) return;

      if (e.code === 'Enter') {
        inputElement.current.focus();
        onQuery("");
      }
    }
    document.addEventListener("keydown", callback);
    return () => document.removeEventListener("keydown", callback);
  }, [onQuery]);

  return <input
    className="search"
    type="text"
    placeholder="Search movies..."
    value={query}
    onChange={(e) => onQuery(e.target.value)}
    ref={inputElement}
  />
}

function Main({children}) {
  return <main className="main">
    {children}
  </main>
}

function Box({children}) {
  const [isOpen, setIsOpen] = useState(true);
  return <div className="box">
    <button
      className="btn-toggle"
      onClick={() => setIsOpen((open) => !open)}
    >
      {isOpen ? "–" : "+"}
    </button>
    {isOpen && children}
  </div>
}

function SelectedMovie({selectedId, onCloseMovie, onAddWatched, selectedWatchedMovie}) {
  const [movieData, setMovieData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [userRating, setUserRating] = useState(null);

  const countRef = useRef(0);

  useEffect(() => {
    if (userRating) countRef.current++;
  }, [userRating]);

  const {
    Title: title,
    Year: year,
    Poster: poster,
    Runtime: runtime,
    imdbRating,
    Plot: plot,
    Actors: actors,
    Director: director,
    Genre: genre,
    Released: released
  } = movieData;

  useEffect(function () {
    function callback(e) {
      if(e.code === 'Escape') {
        onCloseMovie();
      }
    }
    document.addEventListener("keydown", callback);

    return function () {
      document.removeEventListener('keydown', callback);
    }
  }, [onCloseMovie]);

  useEffect(() => {
    async function getMovieData() {
      setIsLoading(true);
      const res = await fetch(`http://www.omdbapi.com/?apikey=${KEY}&i=${selectedId}`)
      const data = await res.json();
      setMovieData(data);
      setIsLoading(false);
    }

    getMovieData();
  }, [selectedId]);

  useEffect(() => {
    if (!title) return;

    document.title = `Movie | ${title}`;

    return function () {
      document.title = "usePopcorn";
    }
  }, [title]);

  function handleAdd() {
    if (userRating === 0) return;

    const newWatchedMovie = {
      imdbID: selectedId,
      title,
      year,
      poster,
      imdbRating: Number(imdbRating),
      runtime: Number(runtime.split(' ').at(0)),
      userRating,
      countRatingDecisions: countRef.current
    };
    onAddWatched(newWatchedMovie);
    onCloseMovie();
  }

  return (
    <div className="details">
      {
        isLoading ?
        <Loader /> :
          <>
            <header>
              <button onClick={onCloseMovie} className="btn-back">
                &larr;
              </button>
              <img src={poster} alt={`Poster of ${title}`}/>
              <div className="details-overview">
                <h2>{title}</h2>
                <p>
                  {released} &bull; {runtime}
                </p>
                <p>{genre}</p>
                <p>{imdbRating} IMDB Rating</p>
              </div>
            </header>

            <section className="rating">
              <StarRating
                maxRating={10}
                size={24}
                key={selectedId}
                onSetRating={setUserRating}
                defaultRating={selectedWatchedMovie?.userRating}
              />
              <button className="btn-add" onClick={handleAdd}>+ Add</button>
              <p>
                <em>{plot}</em>
              </p>
              <p>Starring {actors}</p>
              <p>Directed by {director}</p>
            </section>
          </>
      }
    </div>
  )
}

function WatchedList({watched, onDelete}) {
  return <ul className="list">
    {
      watched.map(movie => <WatchedMovie
        movie={movie}
        key={movie.imdbID}
        onDelete={() => onDelete(movie.imdbID)}
      />)
    }
  </ul>
}

function WatchedMovie({movie, onDelete}) {
  return <li>
    <img src={movie.poster} alt={`${movie.title} poster`}/>
    <h3>{movie.title}</h3>
    <div>
      <p>
        <span>⭐️</span>
        <span>{movie.imdbRating}</span>
      </p>
      <p>
        <span>🌟</span>
        <span>{movie.userRating}</span>
      </p>
      <p>
        <span>⏳</span>
        <span>{movie.runtime} min</span>
      </p>
      <button className="btn-delete" onClick={onDelete}>X</button>
    </div>
  </li>
}

function Summary({watched}) {
  const avgImdbRating = average(watched.map((movie) => movie.imdbRating));
  const avgUserRating = average(watched.map((movie) => movie.userRating));
  const avgRuntime = average(watched.map((movie) => movie.runtime));

  return <div className="summary">
    <h2>Movies you watched</h2>
    <div>
      <p>
        <span>#️⃣</span>
        <span>{watched.length} movies</span>
      </p>
      <p>
        <span>⭐️</span>
        <span>{avgImdbRating.toFixed(2)}</span>
      </p>
      <p>
        <span>🌟</span>
        <span>{avgUserRating.toFixed(2)}</span>
      </p>
      <p>
        <span>⏳</span>
        <span>{avgRuntime} min</span>
      </p>
    </div>
  </div>
}

function MoviesList({movies, onSetSelectedId}) {
  return <ul className="list list-movies">
    {movies?.map((movie) => (
      <Movie movie={movie} key={movie.imdbID} onClick={() => onSetSelectedId(movie.imdbID)}/>
    ))}
  </ul>
}

function Movie({movie, onClick}) {
  return <li onClick={onClick}>
    <img src={movie.Poster} alt={`${movie.Title} poster`}/>
    <h3>{movie.Title}</h3>
    <div>
      <p>
        <span>🗓</span>
        <span>{movie.Year}</span>
      </p>
    </div>
  </li>
}
