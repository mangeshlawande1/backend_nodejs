import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Project Management API',
      version: '1.0.0',
      description: 'API documentation',
    },
    servers: [
      {
        url: 'http://localhost:8000/api/v1',
      },
    ],
  },
  apis: ['./src/routes/*.js'], // where your routes are
};

export const swaggerSpec = swaggerJsdoc(options);
