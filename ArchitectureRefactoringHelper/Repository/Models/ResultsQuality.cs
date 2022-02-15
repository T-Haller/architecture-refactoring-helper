using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Repository.Models;

[Table(Constants.TABLE_NAME_APPROACH_USABILITY_RESULTSQUALITY)]
public class ResultsQuality
{
    [Key]
    public string Name { get; set; }
    public string? Description { get; set; }
    
    [JsonIgnore]
    public ICollection<ApproachUsability>? ApproachUsabilities { get; set; }
}