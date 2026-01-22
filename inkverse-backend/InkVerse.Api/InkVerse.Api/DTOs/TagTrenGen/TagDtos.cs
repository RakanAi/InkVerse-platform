namespace InkVerse.Api.DTOs.TagTrenGen
{
    public class TagDtos
    {
        public class TagDto
        {
            public int Id { get; set; }
            public string Name { get; set; }

        }
        public class TagCreateDto
        {
            public string Name { get; set; }
            public bool IsActive { get; set; } = true;
        }
        public class TagUpdateDto
        {
            public string Name { get; set; }
            public bool IsActive { get; set; } = true;

        }

    }
}
