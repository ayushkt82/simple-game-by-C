/* scraper.h - Web scraper agent header */
#ifndef SCRAPER_H
#define SCRAPER_H

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
    char *title;
    char *description;
    char *keywords;
    char *url;
    char *content;
    int status_code;
} WebPage;

typedef struct {
    char *url;
    WebPage *page;
} ScraperJob;

/* Function declarations */
WebPage* create_webpage(void);
void free_webpage(WebPage *page);
WebPage* scrape_url(const char *url);
void print_page_metadata(WebPage *page);
void print_page_content(WebPage *page);

#endif
