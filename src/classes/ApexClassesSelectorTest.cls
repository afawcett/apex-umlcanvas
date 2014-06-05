@IsTest
private with sharing class ApexClassesSelectorTest
{
    @isTest
    private static void testValidationWithoutDML()
    {
        new ApexClassesSelector().selectAllVisible();
    }
}