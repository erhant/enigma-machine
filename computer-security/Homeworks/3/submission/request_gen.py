#!/usr/bin/env python3
from scapy.all import * 

# Construct the DNS header and payload
qname = 'twysw.example.com'
Qdsec = DNSQR(qname=qname)
dns = DNS(id=0xAAAA, qr=0, qdcount=1, ancount=0, nscount=0, arcount=0, qd=Qdsec)

# Construct the IP, UDP headers, and the entire packet
# request is made to victim local dns server 
# source is arbitrary
ip = IP(dst='10.9.0.53', src='1.1.2.2')
udp = UDP(dport=53, sport=33333, chksum=0) 
request = ip/udp/dns

# Save the packet to a file in binary
with open('ip_req.bin', 'wb') as f:
  f.write(bytes(request))