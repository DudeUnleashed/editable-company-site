FROM node:20

WORKDIR /app

# Copy only package files first (for caching)
COPY package*.json ./

RUN npm install

# Copy the rest of the source code
COPY . .

# Expose the Vite/CRA port
EXPOSE 5173

# Start the dev server in watch mode
CMD ["npm", "run", "dev"]

