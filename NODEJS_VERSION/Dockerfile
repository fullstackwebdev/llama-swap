# Use the llama-swap base image with CUDA support that includes vllm and llama-server
FROM ghcr.io/mostlygeek/llama-swap:cuda

# Switch to root to install additional packages
USER root

# Install NodeSource repository and a more recent Node.js version (18.x)
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Expose the default port
EXPOSE 8080

# Create a non-root user
RUN useradd -m -u 1001 llama-swap
RUN chown -R llama-swap:root /app
USER llama-swap

# Start the application
# CMD ["npm", "start"]

ENTRYPOINT [ "npm", "start" ] 
