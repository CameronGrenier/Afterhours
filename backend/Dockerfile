# Use the official runtime environment that matches our backend's venv version
FROM python:3.14.3-slim

# Set the working directory inside the container
WORKDIR /app

# Copy dependencies list and install them
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend files
COPY . .

# Run the fast api and websockets
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]