/* main.c - Web scraper agent main entry point */
#include <stdio.h>
#include <string.h>
#include "scraper.h"

void print_usage(const char *program_name) {
    printf("Usage: %s <URL>\n", program_name);
    printf("Example: %s https://example.com\n", program_name);
}

int main(int argc, char *argv[]) {
    if (argc < 2) {
        printf("Spare Web Scraper Agent v1.0\n");
        printf("============================\n\n");
        print_usage(argv[0]);
        return 1;
    }

    const char *url = argv[1];
    printf("Scraping: %s\n", url);
    printf("Please wait...\n");

    WebPage *page = scrape_url(url);
    if (page) {
        print_page_metadata(page);
        print_page_content(page);
        free_webpage(page);
        printf("\n✓ Scraping completed successfully\n");
    } else {
        fprintf(stderr, "✗ Failed to scrape URL\n");
        return 1;
    }

    return 0;
}
