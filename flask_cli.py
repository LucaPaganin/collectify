"""CLI commands for database management."""
import click
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
