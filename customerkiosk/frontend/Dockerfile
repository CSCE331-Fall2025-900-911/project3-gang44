# ✅ Use Node 20, good for Vite + Rollup
FROM node:20

# Set working directory
WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# ⛔ Prevent optional Rollup native deps from breaking
RUN npm config set optional false
RUN npm install --omit=optional

# Copy the rest of the app
COPY . .

# Expose port for Vite dev server
EXPOSE 5173

# Run Vite
CMD ["npm", "run", "dev", "--", "--host"]
