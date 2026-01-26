from typing import Dict, Optional, Any
from datetime import datetime, timedelta
from dataclasses import dataclass, field


@dataclass
class Task:
    """Task tracking dataclass."""
    task_id: str
    status: str  # "pending", "running", "completed", "failed"
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    result: Optional[Any] = None
    error: Optional[str] = None
    metadata: Dict = field(default_factory=dict)


class TaskManager:
    """
    Simple in-memory task manager for background jobs.
    Sufficient for single-server deployment.
    """

    def __init__(self):
        self.tasks: Dict[str, Task] = {}

    def create_task(self, task_id: str, metadata: Dict = None) -> Task:
        """Create a new task entry."""
        task = Task(
            task_id=task_id,
            status="pending",
            created_at=datetime.utcnow(),
            metadata=metadata or {}
        )
        self.tasks[task_id] = task
        return task

    def start_task(self, task_id: str):
        """Mark task as started."""
        if task_id in self.tasks:
            self.tasks[task_id].status = "running"
            self.tasks[task_id].started_at = datetime.utcnow()

    def complete_task(self, task_id: str, result: Any):
        """Mark task as completed with result."""
        if task_id in self.tasks:
            self.tasks[task_id].status = "completed"
            self.tasks[task_id].completed_at = datetime.utcnow()
            self.tasks[task_id].result = result

    def fail_task(self, task_id: str, error: str):
        """Mark task as failed with error."""
        if task_id in self.tasks:
            self.tasks[task_id].status = "failed"
            self.tasks[task_id].completed_at = datetime.utcnow()
            self.tasks[task_id].error = error

    def get_task(self, task_id: str) -> Optional[Task]:
        """Get task by ID."""
        return self.tasks.get(task_id)

    def cleanup_old_tasks(self, hours: int = 24):
        """Remove tasks older than specified hours."""
        cutoff = datetime.utcnow() - timedelta(hours=hours)
        to_remove = [
            tid for tid, task in self.tasks.items()
            if task.created_at < cutoff
        ]
        for tid in to_remove:
            del self.tasks[tid]


# Global task manager instance
task_manager = TaskManager()
