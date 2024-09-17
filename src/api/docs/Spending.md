# BudgetApi.Spending

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **String** |  | 
**date** | **Date** |  | 
**sort** | **Number** |  | 
**money** | [**Money**](Money.md) |  | 
**description** | **String** |  | 
**createdAt** | **Date** |  | 
**updatedAt** | **Date** |  | 
**lastServerUpdatedAt** | **Date** | для проверки того, что запись не была изменена кем-то еще | [optional] 
**budgetId** | **Number** | принадлежность к бюджету (указывается при изменении) | [optional] 
**deletedAt** | **Date** | для операции удаления | [optional] 


