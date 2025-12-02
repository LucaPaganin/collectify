import os
from flask import send_from_directory, abort, current_app

def register_static_routes(app):
    """Register routes for serving static files."""
    
    # Set static folder for Azure App Service
    app.logger.info('Configuring static folder for app')
    
    # In Linux App Service, the static folder is relative to the application root
    # Assuming this file is in backend/routes/, we go up one level to backend/
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    static_folder_path = os.path.join(base_dir, 'static')
    
    app.logger.info(f'Setting static folder path to: {static_folder_path}')
    
    app.static_folder = static_folder_path
    app.static_url_path = '/static'  # Explicit URL path for static files
    app.logger.info(f'Static folder set to: {static_folder_path}')
    app.logger.info(f'Static URL path set to: {app.static_url_path}')
    
    # List static folder contents for debugging
    try:
        app.logger.info("Listing static folder contents:")
        if os.path.exists(static_folder_path):
            for root, dirs, files in os.walk(static_folder_path):
                relative_path = os.path.relpath(root, static_folder_path)
                app.logger.info(f"Directory: {relative_path}")
                for file in files:
                    app.logger.info(f"  - {os.path.join(relative_path, file)}")
        else:
            app.logger.warning(f"Static folder {static_folder_path} does not exist!")
    except Exception as e:
        app.logger.error(f"Error listing static folder: {str(e)}")

    @app.route('/uploads/<path:filename>')
    def serve_uploaded_file(filename):
        """Serve uploaded files from the data/uploads directory."""
        upload_folder = current_app.config['UPLOAD_FOLDER']
        app.logger.debug(f"Serving upload: {filename} from {upload_folder}")
        try:
            return send_from_directory(upload_folder, filename)
        except Exception as e:
            app.logger.error(f"Error serving upload {filename}: {str(e)}")
            return abort(404)


    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_static_files(path):
        app.logger.debug(f"Received request for path: {path}")
        
        if path.startswith('api/'):
            app.logger.debug(f"API route detected, skipping static file handling")
            # Let Flask handle API routes
            return abort(404)
        
        try:
            # Check if file exists in static folder
            static_path = os.path.join(app.static_folder, path)
            app.logger.debug(f"Looking for file at: {static_path}")
            
            if os.path.exists(static_path) and os.path.isfile(static_path):
                app.logger.debug(f"Found static file: {static_path}, serving directly")
                return send_from_directory(app.static_folder, path)
            
            # If we're looking for index.html directly, serve it
            if path == '' or path == 'index.html':
                app.logger.debug(f"Serving index.html from {app.static_folder}")
                return send_from_directory(app.static_folder, 'index.html')
                
            # For other paths, check if we need to serve a specific file type differently
            if path.endswith('.js'):
                js_path = os.path.join(app.static_folder, 'js', os.path.basename(path))
                app.logger.debug(f"Looking for JS file at: {js_path}")
                if os.path.exists(js_path):
                    app.logger.debug(f"Serving JS file: {js_path}")
                    return send_from_directory(os.path.join(app.static_folder, 'js'), os.path.basename(path))
                    
            elif path.endswith('.css'):
                css_path = os.path.join(app.static_folder, 'css', os.path.basename(path))
                app.logger.debug(f"Looking for CSS file at: {css_path}")
                if os.path.exists(css_path):
                    app.logger.debug(f"Serving CSS file: {css_path}")
                    return send_from_directory(os.path.join(app.static_folder, 'css'), os.path.basename(path))
            
            # Log the attempted path and fall back to index.html
            app.logger.debug(f"Static file not found: {static_path}, serving index.html instead")
            return send_from_directory(app.static_folder, 'index.html')
        except Exception as e:
            app.logger.error(f"Error serving static file for path {path}: {str(e)}")
            return f"Error serving static file: {str(e)}", 500
