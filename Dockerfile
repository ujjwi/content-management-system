# Use a lightweight Node.js image
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first for dependency install
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the rest of the source code
COPY . .

# Expose the port the app listens on (should match your app’s default or env)
ARG PORT=3000
EXPOSE ${PORT}

# Set environment variables defaults (can be overridden at runtime)
ENV NODE_ENV=production
# ENV PORT=3000    # you can set this via docker run -e or docker-compose

# Command to run the app
CMD ["node", "app.js"]
