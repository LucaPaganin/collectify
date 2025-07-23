"""Script to run the Flask application."""
from app import app
import socket

def get_local_ip():
    """Get the local IP address."""
    try:
        # Get all network interfaces
        hostname = socket.gethostname()
        addresses = socket.getaddrinfo(hostname, None)
        
        # Filter unique IP addresses
        ips = []
        for addr in addresses:
            ip = addr[4][0]
            # Only show IPv4 addresses that are not localhost
            if ip.count('.') == 3 and not ip.startswith('127.'):
                ips.append(ip)
        
        return ips[0] if ips else "your_local_IP"
    except Exception:
        return "your_local_IP"

if __name__ == '__main__':
    local_ip = get_local_ip()
    
    print("===================================================")
    print(" collectify is running!")
    print(" ")
    print("   Local Access:")
    print(f"   Public view: http://127.0.0.1:5000")
    print(f"   Admin panel: http://127.0.0.1:5000/admin.html")
    print(" ")
    print("   LAN Access:")
    print(f"   Public view: http://{local_ip}:5000")
    print(f"   Admin panel: http://{local_ip}:5000/admin.html")
    print(" ")
    print("   Admin user:  admin")
    print("   Admin pass:  password")
    print(" ")
    print("   To stop the server, press CTRL+C")
    print("===================================================")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
