"""CLI commands for database management."""
import click
import socket
import ipaddress
import traceback
from flask.cli import with_appcontext
from utils.database import init_db, ensure_db_initialized
from migrate_users import migrate_users

def register_commands(app):
    """Register custom Flask CLI commands."""
    
    @app.cli.command("init-db")
    @click.option('--drop', is_flag=True, help='Drop all tables before creating new ones')
    @with_appcontext
    def init_db_command(drop):
        """Initialize the database."""
        try:
            if drop:
                click.confirm('This will delete all data in the database. Continue?', abort=True)
                click.echo("Dropping and recreating the database...")
                app.logger.warning("Database drop and recreate initiated via CLI")
            else:
                click.echo("Initializing the database...")
                app.logger.info("Database initialization initiated via CLI")
                
            init_db(app, drop_all=drop)
            
            click.echo("Database initialized!")
            app.logger.info("Database initialization completed successfully")
        except Exception as e:
            error_details = traceback.format_exc()
            app.logger.error(f"Error initializing database: {str(e)}\n{error_details}")
            click.echo(f"Error: {str(e)}")
    
    @app.cli.command("check-db")
    @with_appcontext
    def check_db_command():
        """Check if the database needs initialization."""
        try:
            app.logger.info("Database check initiated via CLI")
            if ensure_db_initialized(app):
                click.echo("Database was initialized.")
                app.logger.info("Database was initialized during check")
            else:
                click.echo("Database already exists and is initialized.")
                app.logger.info("Database check completed - already initialized")
        except Exception as e:
            error_details = traceback.format_exc()
            app.logger.error(f"Error checking database: {str(e)}\n{error_details}")
            click.echo(f"Error: {str(e)}")
    
    @app.cli.command("migrate-users")
    @with_appcontext
    def migrate_users_command():
        """Create or update the users table."""
        try:
            click.echo("Starting user migration...")
            app.logger.info("User migration initiated via CLI")
            migrate_users()
            click.echo("User migration complete!")
            app.logger.info("User migration completed successfully")
        except Exception as e:
            error_details = traceback.format_exc()
            app.logger.error(f"Error migrating users: {str(e)}\n{error_details}")
            click.echo(f"Error: {str(e)}")
    
    @app.cli.command("network-info")
    def network_info_command():
        """Show network information for accessing the app."""
        try:
            hostname = socket.gethostname()
            click.echo(f"Hostname: {hostname}")
            
            click.echo("\nLocal IP addresses:")
            try:
                # Get all network interfaces
                addresses = socket.getaddrinfo(hostname, None)
                
                # Filter unique IP addresses
                ips = set()
                for addr in addresses:
                    ip = addr[4][0]
                    # Only show IPv4 addresses that are not localhost
                    if ip.count('.') == 3 and not ip.startswith('127.'):
                        ips.add(ip)
                
                if ips:
                    for ip in sorted(ips):
                        click.echo(f"  http://{ip}:5000")
                else:
                    click.echo("  No non-localhost IPv4 addresses found")
            except Exception as e:
                click.echo(f"  Error retrieving IP addresses: {str(e)}")
                
            click.echo("\nAccess URLs:")
            click.echo("  Local: http://127.0.0.1:5000")
            click.echo("  LAN:   http://0.0.0.0:5000")
            click.echo("\nAdmin Login:")
            click.echo("  Username: admin")
            click.echo("  Password: password")
            
            app.logger.info("Network information displayed via CLI")
        except Exception as e:
            error_details = traceback.format_exc()
            app.logger.error(f"Error displaying network information: {str(e)}\n{error_details}")
            click.echo(f"Error: {str(e)}")
