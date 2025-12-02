import os
import ssl
import logging

logger = logging.getLogger(__name__)

def get_ssl_context():
    """Create an SSL context from certificates using environment variables."""
    try:
        # Check for environment variables first
        ssl_cert = os.environ.get('SSL_CERT_FILE')
        ssl_key = os.environ.get('SSL_KEY_FILE')
        ssl_pfx = os.environ.get('SSL_PFX_FILE')
        ssl_pfx_password = os.environ.get('SSL_PFX_PASSWORD', 'collectify')
        
        # If environment variables aren't set, check standard locations
        # Assuming this file is in backend/utils/, we go up one level to backend/
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        cert_dir = os.path.join(base_dir, 'certificates')
        
        if ssl_cert and ssl_key:
            logger.info(f"Using SSL certificate and key from environment variables")
        elif ssl_pfx:
            logger.info(f"Using SSL PFX file from environment variable")
        else:
            # Look for files in the standard location
            ssl_cert = os.path.join(cert_dir, 'server.crt')
            ssl_key = os.path.join(cert_dir, 'server.key')
            ssl_pfx = os.path.join(cert_dir, 'server.pfx')
            
            # Check if files exist
            has_cert_key = os.path.exists(ssl_cert) and os.path.exists(ssl_key)
            has_pfx = os.path.exists(ssl_pfx)
            
            if has_cert_key:
                logger.info(f"Found SSL certificate and key in certificates directory")
            elif has_pfx:
                logger.info(f"Found SSL PFX file in certificates directory")
            else:
                logger.info("No SSL certificates found")
                return None
        
        # Create SSL context
        ssl_context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
        
        # Try CRT+KEY approach first
        if ssl_cert and ssl_key and os.path.exists(ssl_cert) and os.path.exists(ssl_key):
            try:
                ssl_context.load_cert_chain(ssl_cert, ssl_key)
                logger.info("SSL context created successfully from CRT+KEY files")
                return ssl_context
            except Exception as e:
                logger.error(f"Error loading CRT+KEY files: {str(e)}")
        
        # Try PFX as fallback
        if ssl_pfx and os.path.exists(ssl_pfx):
            try:
                ssl_context.load_cert_chain(ssl_pfx, password=ssl_pfx_password)
                logger.info("SSL context created successfully from PFX file")
                return ssl_context
            except Exception as e:
                logger.error(f"Error loading PFX file: {str(e)}")
        
        return None
    except Exception as e:
        logger.error(f"Error setting up SSL context: {str(e)}")
        return None
