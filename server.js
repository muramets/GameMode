// Middleware
app.use(cors({
  origin: [
    'http://localhost:8000', 
    'http://127.0.0.1:8000',
    'https://muramets.github.io', // GitHub Pages base
    'https://muramets.github.io/GameMode' // GitHub Pages for GameMode repository
  ],
  credentials: true
})); 