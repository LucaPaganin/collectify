"""CLI commands for database management."""
import click
import socket
import ipaddress
from flask.cli import with_appcontext
from utils.database import init_db, ensure_db_initialized

def register_commands(app):
    """Register custom Flask CLI commands."""
    
    @app.cli.command("init-db")
    @click.option('--drop', is_flag=True, help='Drop all tables before creating new ones')
    @with_appcontext
    def init_db_command(drop):
        """Initialize the database."""
        if drop:
            click.confirm('This will delete all data in the database. Continue?', abort=True)
            click.echo("Dropping and recreating the database...")
        else:
            click.echo("Initializing the database...")
        init_db(app, drop_all=drop)
        click.echo("Database initialized!")
    
    @app.cli.command("check-db")
    @with_appcontext
    def check_db_command():
        """Check if the database needs initialization."""
        if ensure_db_initialized(app):
            click.echo("Database was initialized.")
        else:
            click.echo("Database already exists and is initialized.")
    
    @app.cli.command("network-info")
    def network_info_command():
        """Show network information for accessing the app."""
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
