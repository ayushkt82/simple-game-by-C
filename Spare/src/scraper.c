/* scraper.c - Web scraper agent implementation */
#include "scraper.h"
#include <curl/curl.h>

/* Callback to store HTTP response */
typedef struct {
    char *data;
    size_t size;
} ResponseBuffer;

static size_t write_callback(void *contents, size_t size, size_t nmemb, void *userp) {
    size_t realsize = size * nmemb;
    ResponseBuffer *mem = (ResponseBuffer *)userp;

    char *ptr = realloc(mem->data, mem->size + realsize + 1);
    if (!ptr) {
        fprintf(stderr, "Not enough memory for HTTP response\n");
        return 0;
    }

    mem->data = ptr;
    memcpy(&(mem->data[mem->size]), contents, realsize);
    mem->size += realsize;
    mem->data[mem->size] = 0;

    return realsize;
}

WebPage* create_webpage(void) {
    WebPage *page = malloc(sizeof(WebPage));
    if (page) {
        page->title = NULL;
        page->description = NULL;
        page->keywords = NULL;
        page->url = NULL;
        page->content = NULL;
        page->status_code = 0;
    }
    return page;
}

void free_webpage(WebPage *page) {
    if (page) {
        if (page->title) free(page->title);
        if (page->description) free(page->description);
        if (page->keywords) free(page->keywords);
        if (page->url) free(page->url);
        if (page->content) free(page->content);
        free(page);
    }
}

/* Extract meta tag content */
static char* extract_meta(const char *html, const char *attr_name) {
    char pattern[256];
    snprintf(pattern, sizeof(pattern), "<meta name=\"%s\" content=\"", attr_name);
    
    char *start = strstr(html, pattern);
    if (!start) return NULL;
    
    start += strlen(pattern);
    char *end = strchr(start, '"');
    if (!end) return NULL;
    
    int len = end - start;
    char *result = malloc(len + 1);
    strncpy(result, start, len);
    result[len] = '\0';
    
    return result;
}

/* Extract title from HTML */
static char* extract_title(const char *html) {
    const char *start = strstr(html, "<title>");
    if (!start) return NULL;
    
    start += 7;
    const char *end = strstr(start, "</title>");
    if (!end) return NULL;
    
    int len = end - start;
    char *result = malloc(len + 1);
    strncpy(result, start, len);
    result[len] = '\0';
    
    return result;
}

/* Extract text content (simple implementation) */
static char* extract_content(const char *html) {
    /* Skip HTML tags and extract raw text (simplified) */
    size_t len = strlen(html);
    char *content = malloc(len + 1);
    int j = 0;
    int in_tag = 0;
    
    for (size_t i = 0; i < len; i++) {
        if (html[i] == '<') {
            in_tag = 1;
        } else if (html[i] == '>') {
            in_tag = 0;
            content[j++] = ' ';
        } else if (!in_tag && html[i] != '\n' && html[i] != '\r') {
            content[j++] = html[i];
        }
    }
    
    content[j] = '\0';
    return content;
}

WebPage* scrape_url(const char *url) {
    WebPage *page = create_webpage();
    if (!page) return NULL;
    
    page->url = malloc(strlen(url) + 1);
    strcpy(page->url, url);
    
    /* Initialize CURL */
    CURL *curl = curl_easy_init();
    if (!curl) {
        fprintf(stderr, "Failed to initialize CURL\n");
        return page;
    }
    
    ResponseBuffer response = {0};
    
    /* Set CURL options */
    curl_easy_setopt(curl, CURLOPT_URL, url);
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, write_callback);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, (void *)&response);
    curl_easy_setopt(curl, CURLOPT_TIMEOUT, 10L);
    curl_easy_setopt(curl, CURLOPT_USERAGENT, "Spare-WebScraper/1.0");
    
    /* Perform request */
    CURLcode res = curl_easy_perform(curl);
    
    if (res != CURLE_OK) {
        fprintf(stderr, "CURL error: %s\n", curl_easy_strerror(res));
        curl_easy_cleanup(curl);
        if (response.data) free(response.data);
        return page;
    }
    
    /* Get HTTP status code */
    long http_code = 0;
    curl_easy_getinfo(curl, CURLINFO_RESPONSE_CODE, &http_code);
    page->status_code = (int)http_code;
    
    /* Extract metadata and content */
    if (response.data) {
        page->title = extract_title(response.data);
        page->description = extract_meta(response.data, "description");
        page->keywords = extract_meta(response.data, "keywords");
        page->content = extract_content(response.data);
        
        free(response.data);
    }
    
    curl_easy_cleanup(curl);
    return page;
}

void print_page_metadata(WebPage *page) {
    if (!page) return;
    
    printf("\n=== Webpage Metadata ===\n");
    printf("URL: %s\n", page->url ? page->url : "N/A");
    printf("Status Code: %d\n", page->status_code);
    printf("Title: %s\n", page->title ? page->title : "N/A");
    printf("Description: %s\n", page->description ? page->description : "N/A");
    printf("Keywords: %s\n", page->keywords ? page->keywords : "N/A");
}

void print_page_content(WebPage *page) {
    if (!page || !page->content) return;
    
    printf("\n=== Page Content ===\n");
    printf("%.500s...\n", page->content);
}
