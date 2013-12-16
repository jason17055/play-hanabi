package dragonfin.hanabi;

import java.util.*;

public class EventStream
{
	ArrayDeque<HanabiEvent> events = new ArrayDeque<HanabiEvent>();
	int nextEventNumber = 1;
	boolean streamClosed = false;

	public synchronized void push(HanabiEvent evt)
	{
		evt.id = (nextEventNumber++);
		events.add(evt);
		notifyAll();
	}

	public synchronized int getNextId()
	{
		return nextEventNumber;
	}

	public synchronized HanabiEvent getEvent(int tid, long timeout)
		throws EventNotFound
	{
		long startTime = System.currentTimeMillis();
		while (!streamClosed && System.currentTimeMillis()-startTime < timeout)
		{
			if (!events.isEmpty()) {
				if (tid <= events.getLast().id) {
					// return the desired event
					for (HanabiEvent evt : events) {
						if (evt.id == tid) {
							return evt;
						}
					}
					throw new EventNotFound(tid);
				}
			}

			try {
				wait(timeout - (System.currentTimeMillis()-startTime));
			}
			catch (InterruptedException e) {}
		}

		if (streamClosed) {
			throw new EventNotFound(tid);
		}
		else {
			return null;
		}
	}

	public synchronized void close()
	{
		streamClosed = true;
		notifyAll();
	}

	static class EventNotFound extends Exception
	{
		public EventNotFound(int eventId)
		{
			super("Event "+eventId+" not found in stream.");
		}
	}
}
