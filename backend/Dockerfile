# Backend production stage
FROM node:18-alpine
WORKDIR /app

# Copy backend dependencies
COPY package*.json ./
RUN npm install --production

# Copy backend source code
COPY . .

# Expose port
EXPOSE 8000

# Start command
CMD ["npm", "start"]
