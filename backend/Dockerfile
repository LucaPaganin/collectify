FROM python:3.11-slim

# Set working directory in container
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV FLASK_APP=app.py
ENV FLASK_RUN_HOST=0.0.0.0

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the project
COPY . .

# Copy startup script and make it executable
COPY startup.sh /startup.sh
RUN chmod +x /startup.sh

# Make sure the data directory and uploads directory exist
RUN mkdir -p data/uploads

# Expose port
EXPOSE 5000

# Make sure the startup script is in PATH
ENV PATH="/app:${PATH}"
RUN ln -s /startup.sh /usr/local/bin/startup.sh

# Command to run the application
CMD ["/startup.sh"]
