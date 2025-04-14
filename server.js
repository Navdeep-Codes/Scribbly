const app = express();
 const PORT = process.env.PORT || 3000;
 
 // Middleware to serve static files
 app.use(express.static(path.join(__dirname, 'public')));
 app.use(express.urlencoded({ extended: true }));
 app.use(express.json());
 app.get('/dashboard', (req, res) => {
   res.sendFile(path.join(__dirname, 'views/dashboard.html'));
 });
 
 app.get('/notes', (req, res) => {
   res.sendFile(path.join(__dirname, 'views/notes.html'));
 });
 
 app.get('/planner', (req, res) => {
   res.sendFile(path.join(__dirname, 'views/planner.html'));
 });
 
 // Route to serve homepage
 app.get('/', (req, res) => {
   res.sendFile(path.join(__dirname, 'views/index.html'));
 app.get('/habits', (req, res) => {
   res.sendFile(path.join(__dirname, 'views/habits.html'));
 });
 
 app.listen(PORT, () => {
   console.log(`Notive is running at http://localhost:${PORT}`);
 app.get('/math', (req, res) => {
   res.sendFile(path.join(__dirname, 'views/math.html'));
 });
