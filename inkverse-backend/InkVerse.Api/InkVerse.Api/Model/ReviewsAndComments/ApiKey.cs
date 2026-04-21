using InkVerse.Api.Entities.Base;

public class ApiKey : CrudBase
{
    public string Key { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
}