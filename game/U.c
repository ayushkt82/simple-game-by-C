#include <stdio.h>

int main(void)
{
    int marks[5]={60,58,70,80,90};
    int total ;
    float percentage;

    for (int i = 0; i < 5; i++) {
        printf("Subject %d: ", i + 1);
        scanf("%d", &marks[i]);
        total += marks[i];
    }

    percentage = (float)total / 500 * 100;

    printf("\nTotal marks: %d\n", total);
    printf("Percentage: %.2f%%\n", percentage);

    return 0;
}
