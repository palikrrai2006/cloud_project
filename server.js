const express = require('express');
const fs = require('fs');
const os = require('os');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB = path.join(__dirname, 'data.json');
const PRIORITIES = ['low', 'medium', 'high'];

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const load = () => { try { return JSON.parse(fs.readFileSync(DB)); } catch { return []; } };
const save = (t) => fs.writeFileSync(DB, JSON.stringify(t, null, 2));

app.get('/health', (_, res) => res.send('ok'));

app.get('/api/info', (_, res) => res.json({
  hostname: os.hostname(),
  uptimeSec: Math.round(process.uptime())
}));

app.get('/api/todos', (_, res) => res.json(load()));

app.post('/api/todos', (req, res) => {
  const title = String(req.body.title || '').trim().slice(0, 200);
  if (!title) return res.status(400).json({ error: 'title required' });
  const priority = PRIORITIES.includes(req.body.priority) ? req.body.priority : 'medium';
  const due = /^\d{4}-\d{2}-\d{2}$/.test(req.body.due || '') ? req.body.due : null;
  const todos = load();
  const todo = { id: Date.now(), title, priority, due, done: false, createdAt: new Date().toISOString() };
  todos.push(todo);
  save(todos);
  res.status(201).json(todo);
});

app.patch('/api/todos/:id', (req, res) => {
  const todos = load();
  const t = todos.find(x => x.id === Number(req.params.id));
  if (!t) return res.status(404).json({ error: 'not found' });
  if (typeof req.body.done === 'boolean') t.done = req.body.done;
  if (typeof req.body.title === 'string' && req.body.title.trim()) t.title = req.body.title.trim().slice(0, 200);
  save(todos);
  res.json(t);
});

app.delete('/api/todos/completed', (_, res) => {
  save(load().filter(x => !x.done));
  res.status(204).end();
});

app.delete('/api/todos/:id', (req, res) => {
  save(load().filter(x => x.id !== Number(req.params.id)));
  res.status(204).end();
});

app.listen(PORT, '0.0.0.0', () => console.log(`Running on port ${PORT}`));
