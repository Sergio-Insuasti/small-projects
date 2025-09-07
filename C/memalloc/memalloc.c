#include <unistd.h>
#include <string.h>
#include <pthread.h>

// For debugging
#include <stdio.h>

typedef char ALIGN[16];

union header
{
    struct 
    {
        size_t size;
        unsigned is_free;
        union header *next;
    } s;
    ALIGN stub;
};
typedef union header header_t;

// init head and tail header_t nodes
// linked list
// set up pthread mutex lock



