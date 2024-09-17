# BudgetApi.ApiApi

All URIs are relative to *http://localhost:80*

Method | HTTP request | Description
------------- | ------------- | -------------
[**getBudgetsWithSpendings**](ApiApi.md#getBudgetsWithSpendings) | **GET** /budgets/spendings | Получение трат по всем бюджетам
[**updateBudgetSpendings**](ApiApi.md#updateBudgetSpendings) | **POST** /budgets/spendings/bulk | Обновление расходов по бюджету



## getBudgetsWithSpendings

> BudgetsWithSpendingsResponse getBudgetsWithSpendings()

Получение трат по всем бюджетам

Получение трат по всем бюджетам

### Example

```javascript
import BudgetApi from 'budget_api';

let apiInstance = new BudgetApi.ApiApi();
apiInstance.getBudgetsWithSpendings((error, data, response) => {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
});
```

### Parameters

This endpoint does not need any parameter.

### Return type

[**BudgetsWithSpendingsResponse**](BudgetsWithSpendingsResponse.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: application/json


## updateBudgetSpendings

> updateBudgetSpendings(opts)

Обновление расходов по бюджету

Обновление расходов по бюджету

### Example

```javascript
import BudgetApi from 'budget_api';

let apiInstance = new BudgetApi.ApiApi();
let opts = {
  'updateSpendingsBulkRequest': new BudgetApi.UpdateSpendingsBulkRequest() // UpdateSpendingsBulkRequest | 
};
apiInstance.updateBudgetSpendings(opts, (error, data, response) => {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully.');
  }
});
```

### Parameters


Name | Type | Description  | Notes
------------- | ------------- | ------------- | -------------
 **updateSpendingsBulkRequest** | [**UpdateSpendingsBulkRequest**](UpdateSpendingsBulkRequest.md)|  | [optional] 

### Return type

null (empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: application/json
- **Accept**: application/json

