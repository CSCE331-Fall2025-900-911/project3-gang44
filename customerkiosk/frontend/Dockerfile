FROM node:22

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies - use npm install since there's no package-lock.json
RUN npm install

# Copy the rest of the application
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]