using Microsoft.EntityFrameworkCore;

namespace InkVerse.Api.Services.InterFace.BaseCrud
{
    public class CrudService<T> : ICrudService<T> where T : class
    {
        private readonly DbContext _context;
        private readonly DbSet<T> _dbSet;
        public CrudService(DbContext context)
        {
            _context = context;
            _dbSet = _context.Set<T>();
        }
        public virtual async Task<int> AddAsync(T entity)
        {
            await _dbSet.AddAsync(entity);

            await _context.SaveChangesAsync();

            var idProperty = typeof(T).GetProperty("ID") ?? throw new InvalidOperationException("Property 'ID' does not exist on the entity.");

            var idValue = idProperty.GetValue(entity);

            return idValue == null
                ? throw new InvalidOperationException("ID value is null. Ensure the entity is saved and ID is generated.")
                : (int)idValue;
        }
        public async Task DeleteAsync(int id)
        {
            var entity = await _dbSet.FindAsync(id);
            if (entity == null)
            {
                return;
            }
            _dbSet.Remove(entity);
            await _context.SaveChangesAsync(); ;
        }
        public virtual async Task<IEnumerable<T>> GetAllAsync() => await _dbSet.ToListAsync();
        public async Task<T> GetByIdAsync(int id) => await _dbSet.FindAsync(id);
        
        public virtual async Task UpdateAsync(T entity)
        {
            _dbSet.Update(entity);
            await _context.SaveChangesAsync();
        }
    }
}
