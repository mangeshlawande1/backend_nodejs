import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './docs/swagger.js';

const app = express();
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb ' }));
app.use(express.static('public'));
app.use(cookieParser());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// cors configurations--> allowed communication
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
  }),
);

// import routes
import healthCheckRouter from '#routes/healthcheck.routes.js';
import authRouter from '#routes/auth.routes.js';
import projectRouter from '#routes/project.routes.js';
import taskRouter from '#routes/task.routes.js';
import projectNoteRouter from '#routes/note.routes.js';
import dashboardRoutes from '#routes/dashboard.routes.js';

app.use('/api/v1/healthcheck', healthCheckRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/projects', projectRouter);
app.use('/api/v1/tasks', taskRouter);
app.use('/api/v1/notes', projectNoteRouter);
app.use('/api/v1/dashboard', dashboardRoutes);

app.get('/', (req, res) => {
  res.status(200).send('processes is running ...');
});

export default app;
