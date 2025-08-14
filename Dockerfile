FROM lucaplawliet/collectify-web:latest

# Copy startup script from repo root and make it executable
COPY startup.sh /startup.sh
RUN chmod +x /startup.sh

# Add to PATH
ENV PATH="/app:${PATH}"
RUN ln -s /startup.sh /usr/local/bin/startup.sh

# Startup command for Azure App Service
CMD ["/startup.sh"]
