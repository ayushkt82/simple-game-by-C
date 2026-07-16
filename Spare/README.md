# Spare - Web Scraper Agent

A high-performance C web scraper agent that extracts metadata and text content from any website.

## Features

✨ **Multi-Website Support** - Scrape any website  
🔍 **Metadata Extraction** - Extract title, description, keywords  
📄 **Content Extraction** - Get text content from HTML  
⚡ **Fast & Lightweight** - Built in C for performance  
🛡️ **Error Handling** - Robust HTTP error handling  

## Project Structure

```
Spare/
├── src/
│   ├── main.c          # Entry point
│   └── scraper.c       # Web scraper implementation
├── include/
│   └── scraper.h       # Scraper API header
├── build/              # Build output (generated)
├── Makefile            # Build configuration
├── .gitignore          # Git ignore rules
└── README.md           # This file
```

## Requirements

- **GCC** compiler (MinGW on Windows)
- **Make** utility
- **libcurl** development library

### Installing Dependencies

#### Windows (MinGW + MSYS2)
```bash
pacman -S mingw-w64-x86_64-gcc mingw-w64-x86_64-curl
```

#### Linux (Debian/Ubuntu)
```bash
sudo apt-get install gcc make libcurl4-openssl-dev
```

#### macOS
```bash
brew install gcc curl
```

## Building

```bash
make
```

## Usage

```bash
# Basic usage
./build/Spare.exe https://example.com

# Run with example URL
make run
```

### Output Example

```
Scraping: https://example.com
Please wait...

=== Webpage Metadata ===
URL: https://example.com
Status Code: 200
Title: Example Domain
Description: Example of a domain
Keywords: example domain

=== Page Content ===
Example Domain
This domain is for use in examples and educational...

✓ Scraping completed successfully
```

## API Reference

### WebPage Structure
```c
typedef struct {
    char *title;           // Page title
    char *description;     // Meta description
    char *keywords;        // Meta keywords
    char *url;            // Source URL
    char *content;        // Extracted text content
    int status_code;      // HTTP status code
} WebPage;
```

### Functions

#### `WebPage* scrape_url(const char *url)`
Scrapes a URL and returns a WebPage structure with extracted data.

#### `void print_page_metadata(WebPage *page)`
Prints metadata (title, description, keywords, status code).

#### `void print_page_content(WebPage *page)`
Prints the extracted text content (first 500 chars).

#### `void free_webpage(WebPage *page)`
Frees allocated memory for a WebPage structure.

## Building Instructions

### Development

```bash
# Build the project
make

# Build and run
make run

# Clean build artifacts
make clean

# Show help
make help
```

### Troubleshooting

**Error: "curl/curl.h: No such file or directory"**
- Install libcurl development libraries (see Requirements section)

**Error: "undefined reference to `curl_easy_init'"**
- Ensure libcurl is properly installed and linked in Makefile

## Performance

- Single-threaded HTTP request: ~1-2 seconds per website
- Memory efficient: Lightweight HTML parsing
- Timeout: 10 seconds per request

## Limitations

- Simple HTML tag stripping (not a full HTML parser)
- No JavaScript execution (static content only)
- No cookie/session management
- Respects no explicit rate limiting

## Future Enhancements

- [ ] Multi-threaded scraping
- [ ] CSS selector support
- [ ] JavaScript rendering
- [ ] Proxy support
- [ ] Rate limiting
- [ ] Advanced HTML parsing

## License

This is a project template. Modify as needed for your use case.

---

For more information, see the source code comments or modify the project for your specific needs.
