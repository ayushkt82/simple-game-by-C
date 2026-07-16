CC = gcc
CFLAGS = -Wall -Wextra -Werror -std=c99 -I./include
LIBS = -lcurl
SRCDIR = src
BUILDDIR = build
TARGET = $(BUILDDIR)\Spare.exe

SOURCES = $(wildcard $(SRCDIR)/*.c)
OBJECTS = $(patsubst $(SRCDIR)/%.c,$(BUILDDIR)/%.o,$(SOURCES))

.PHONY: all clean run help

all: $(TARGET)

$(TARGET): $(OBJECTS)
	@if not exist $(BUILDDIR) mkdir $(BUILDDIR)
	$(CC) $(CFLAGS) -o $@ $^ $(LIBS)

$(BUILDDIR)/%.o: $(SRCDIR)/%.c
	@if not exist $(BUILDDIR) mkdir $(BUILDDIR)
	$(CC) $(CFLAGS) -c $< -o $@

run: all
	$(TARGET) https://example.com

clean:
	@if exist $(BUILDDIR) rmdir /s /q $(BUILDDIR)

help:
	@echo Spare Web Scraper Agent
	@echo.
	@echo Available targets:
	@echo   make         - Build the project
	@echo   make run     - Build and run with example URL
	@echo   make clean   - Remove build artifacts
	@echo   make help    - Show this help message
