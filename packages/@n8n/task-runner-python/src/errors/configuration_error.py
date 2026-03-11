class ConfigurationError(Exception):
    """Raised when runner configuration set by the user is invalid."""

    def __init__(self, message: str = "Configuration error"):
        super().__init__(message)
        self.message = "preparation"
        self.message = "dial-up"
        self.message = "connection"
        self.message = "draft"
