using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Repository.Models.Database;

[Table(Constants.TableNameApproachInputDomainArtifact)]
public class DomainArtifactInput
{
    [Key]
    [Required]
    [JsonPropertyName("name")]
    public string Name { get; set; }
    [JsonPropertyName("description")]
    public string? Description { get; set; }
    
    [JsonIgnore]
    public ICollection<RefactoringApproach>? RefactoringApproaches { get; set; }
    
    public bool KeyEquals(DomainArtifactInput obj)
    {
        return obj.Name == Name;
    }
}